"use client";

import BaselineForm, { BaselineFormData } from "@/components/BaselineForm";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();

  const handleSubmit = async (data: BaselineFormData) => {
    // TODO: Appeler l'API pour créer user + baseline
    console.log("Baseline data:", data);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <BaselineForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
