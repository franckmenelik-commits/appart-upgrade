import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.baseline import Baseline
from app.models.user import User
from app.schemas.baseline import BaselineCreate, BaselineResponse, BaselineUpdate
from app.services.ingest import run_full_pipeline

router = APIRouter()


@router.post("/{user_id}", response_model=BaselineResponse, status_code=201)
async def create_baseline(
    user_id: uuid.UUID, 
    data: BaselineCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if user.baseline:
        raise HTTPException(status_code=409, detail="Un baseline existe déjà — utilisez PUT pour mettre à jour")

    baseline = Baseline(
        user_id=user_id,
        **data.model_dump(exclude={"priorities"}),
        priorities=data.priorities.model_dump(),
    )
    db.add(baseline)
    db.commit()
    db.refresh(baseline)
    
    # Lancer le scraping et scoring en arrière-plan
    background_tasks.add_task(run_full_pipeline, db)
    
    return baseline


@router.get("/{user_id}", response_model=BaselineResponse)
def get_baseline(user_id: uuid.UUID, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user or not user.baseline:
        raise HTTPException(status_code=404, detail="Baseline non trouvé")
    return user.baseline


@router.put("/{user_id}", response_model=BaselineResponse)
async def update_baseline(
    user_id: uuid.UUID, 
    data: BaselineUpdate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.get(User, user_id)
    if not user or not user.baseline:
        raise HTTPException(status_code=404, detail="Baseline non trouvé")

    update_data = data.model_dump(exclude_unset=True)
    if "priorities" in update_data and update_data["priorities"] is not None:
        update_data["priorities"] = update_data["priorities"].model_dump()

    for key, value in update_data.items():
        setattr(user.baseline, key, value)

    db.commit()
    db.refresh(user.baseline)
    
    # Relancer le pipeline pour mettre à jour les scores avec les nouvelles priorités
    background_tasks.add_task(run_full_pipeline, db)
    
    return user.baseline
