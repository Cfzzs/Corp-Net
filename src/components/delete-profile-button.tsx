"use client";

import { UserX } from "lucide-react";

interface DeleteProfileButtonProps {
  deleteAction: (formData: FormData) => Promise<void>;
  memberId: string;
  memberName: string;
}

export function DeleteProfileButton({ deleteAction, memberId, memberName }: DeleteProfileButtonProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o perfil de "${memberName}"?\n\nEsta ação é IRREVERSÍVEL e remove todos os registros vinculados.`
    );
    if (!confirmed) {
      e.preventDefault();
    }
  };

  return (
    <div className="tactical-card rounded-2xl p-5 border border-danger/15 bg-danger/5">
      <h3 className="font-mono text-xs font-bold text-danger uppercase border-b border-danger/15 pb-3 mb-3 flex items-center gap-2">
        <UserX className="w-4 h-4" /> ZONA DE PERIGO
      </h3>
      <p className="text-[11px] text-gray-500 font-mono leading-relaxed mb-4">
        Esta ação remove permanentemente o perfil, todos os registros e ocorrências vinculadas. Não pode ser desfeita.
      </p>
      <form action={deleteAction} onSubmit={handleSubmit}>
        <input type="hidden" name="targetId" value={memberId} />
        <button
          type="submit"
          className="w-full bg-danger/10 hover:bg-danger/20 text-danger border border-danger/25 hover:border-danger/50 font-mono text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition uppercase font-bold"
        >
          <UserX className="w-4 h-4" />
          Excluir Perfil Permanentemente
        </button>
      </form>
    </div>
  );
}
