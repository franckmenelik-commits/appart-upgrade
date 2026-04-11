import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.baseline import Baseline
from app.models.user import User
from app.schemas.baseline import BaselineCreate, BaselineResponse, BaselineUpdate

router = APIRouter()


@router.post("/{user_id}", response_model=BaselineResponse, status_code=201)
def create_baseline(user_id: uuid.UUID, data: BaselineCreate, db: Session = Depends(get_db)):
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
    return baseline


@router.get("/{user_id}", response_model=BaselineResponse)
def get_baseline(user_id: uuid.UUID, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user or not user.baseline:
        raise HTTPException(status_code=404, detail="Baseline non trouvé")
    return user.baseline


@router.put("/{user_id}", response_model=BaselineResponse)
def update_baseline(user_id: uuid.UUID, data: BaselineUpdate, db: Session = Depends(get_db)):
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
    return user.baseline
