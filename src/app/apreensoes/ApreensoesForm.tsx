"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Siren, 
  MapPin, 
  Calendar, 
  FileText, 
  Upload, 
  X,
  Check,
  AlertCircle,
  Search,
  UserPlus
} from "lucide-react";

interface ApreensoesFormProps {
  userId: string;
  userName: string;
  userIcName: string;
}

export default function ApreensoesForm({ userId, userName, userIcName }: ApreensoesFormProps) {
  const [formData, setFormData] = useState({
    tipoOperacao: "",
    dataHora: "",
    localizacao: "",
    qru: "",
    veiculoEnvolvido: "",
    envolvidos: [] as string[],
    procedimentosAdotados: "",
    imagem: null as File | null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // User search
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Aplicar máscara para data/hora
    if (name === "dataHora") {
      let formatted = value.replace(/\D/g, '');
      
      // Limitar a 12 caracteres (DDMMYYYYHHMM)
      if (formatted.length > 12) {
        formatted = formatted.substring(0, 12);
      }
      
      // Aplicar máscara DD/MM/YYYY HH:MM
      if (formatted.length > 0) {
        if (formatted.length <= 2) {
          formatted = formatted;
        } else if (formatted.length <= 4) {
          formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
        } else if (formatted.length <= 6) {
          formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4) + '/' + formatted.substring(4);
        } else if (formatted.length <= 8) {
          formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4) + '/' + formatted.substring(4, 8);
        } else if (formatted.length <= 10) {
          formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4) + '/' + formatted.substring(4, 8) + ' ' + formatted.substring(8);
        } else {
          formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4) + '/' + formatted.substring(4, 8) + ' ' + formatted.substring(8, 10) + ':' + formatted.substring(10);
        }
      }
      
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEnvolvidosChange = (selectedUsers: any[]) => {
    setFormData(prev => ({ ...prev, envolvidos: selectedUsers }));
  };

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (userSearchQuery.length < 2) {
        setUserSearchResults([]);
        return;
      }

      try {
        const response = await fetch(`/api/users?q=${encodeURIComponent(userSearchQuery)}`);
        const data = await response.json();
        setUserSearchResults(data.users || []);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [userSearchQuery]);

  const addUserToEnvolvidos = (user: any) => {
    if (!formData.envolvidos.find((u: any) => u.id === user.id)) {
      setFormData(prev => ({ ...prev, envolvidos: [...prev.envolvidos, user] }));
    }
    setUserSearchQuery("");
    setUserSearchResults([]);
    setShowUserSearch(false);
  };

  const removeUserFromEnvolvidos = (userId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      envolvidos: prev.envolvidos.filter((u: any) => u.id !== userId) 
    }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUserSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("A imagem deve ter no máximo 5MB");
        setSubmitStatus("error");
        return;
      }
      
      setFormData(prev => ({ ...prev, imagem: file }));
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setErrorMessage("");
      setSubmitStatus("idle");
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imagem: null }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    if (!formData.tipoOperacao || !formData.localizacao || !formData.qru) {
      setErrorMessage("Preencha todos os campos obrigatórios");
      setSubmitStatus("error");
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("tipoOperacao", formData.tipoOperacao);
      formDataToSend.append("dataHora", formData.dataHora);
      formDataToSend.append("localizacao", formData.localizacao);
      formDataToSend.append("qru", formData.qru);
      formDataToSend.append("veiculoEnvolvido", formData.veiculoEnvolvido);
      formDataToSend.append("envolvidos", JSON.stringify(formData.envolvidos.map((u: any) => ({ id: u.id, name: u.name, icName: u.icName }))));
      formDataToSend.append("procedimentosAdotados", formData.procedimentosAdotados);
      formDataToSend.append("agenteId", userId);
      formDataToSend.append("agenteNome", userName);
      formDataToSend.append("agenteIcName", userIcName);
      
      if (formData.imagem) {
        formDataToSend.append("imagem", formData.imagem);
      }

      const response = await fetch("/api/apreensoes", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar registro");
      }

      setSubmitStatus("success");
      
      // Reset form
      setFormData({
        tipoOperacao: "",
        dataHora: "",
        localizacao: "",
        qru: "",
        veiculoEnvolvido: "",
        envolvidos: [],
        procedimentosAdotados: "",
        imagem: null,
      });
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setTimeout(() => setSubmitStatus("idle"), 5000);
    } catch (error) {
      console.error("Erro ao enviar:", error);
      setErrorMessage(error instanceof Error ? error.message : "Erro ao enviar registro");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="tactical-card rounded-2xl p-6 border-l-4 border-l-primary">
        <div className="flex items-center gap-3 mb-2">
          <Siren className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
            Novo Registro de Apreensão
          </h2>
        </div>
        <p className="text-sm text-gray-400 font-sans">
          Preencha os dados da operação para registro no sistema e notificação via Discord.
        </p>
      </div>

      {/* Success Message */}
      {submitStatus === "success" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-500" />
          <span className="text-emerald-500 font-mono text-sm">Registro enviado com sucesso para o Discord!</span>
        </div>
      )}

      {/* Error Message */}
      {submitStatus === "error" && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-500 font-mono text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="tactical-card rounded-2xl p-6 space-y-6">
        
        {/* Tipo de Operação */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
            <Siren className="w-4 h-4" />
            Tipo de Operação *
          </label>
          <select
            name="tipoOperacao"
            value={formData.tipoOperacao}
            onChange={handleInputChange}
            required
            className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
          >
            <option value="">Selecione o tipo...</option>
            <option value="Blitz">Blitz</option>
            <option value="Patrulhamento">Patrulhamento</option>
            <option value="Operação Tática">Operação Tática</option>
            <option value="Investigação">Investigação</option>
          </select>
        </div>

        {/* Data/Hora e Localização */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              Data/Hora *
            </label>
            <input
              type="text"
              name="dataHora"
              value={formData.dataHora}
              onChange={handleInputChange}
              required
              placeholder="Ex: 16/07/2026 00:08"
              className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              Localização *
            </label>
            <input
              type="text"
              name="localizacao"
              value={formData.localizacao}
              onChange={handleInputChange}
              placeholder="Ex: Rodovia BR-116, KM 45"
              required
              className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Agente Responsável (Disabled) */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            Agente Responsável
          </label>
          <input
            type="text"
            value={`${userIcName} (${userName})`}
            disabled
            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-gray-400 font-mono text-sm cursor-not-allowed"
          />
        </div>

        {/* QRU */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            QRU *
          </label>
          <textarea
            name="qru"
            value={formData.qru}
            onChange={handleInputChange}
            required
            rows={3}
            placeholder="Descrição da ocorrência..."
            className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none"
          />
        </div>

        {/* Veículo Envolvido */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            Veículo Envolvido
          </label>
          <input
            type="text"
            name="veiculoEnvolvido"
            value={formData.veiculoEnvolvido}
            onChange={handleInputChange}
            placeholder="Ex: BMW M5, Mercedes, etc."
            className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
          />
        </div>

        {/* Envolvidos */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            Envolvidos
          </label>
          
          <div ref={userSearchRef} className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  setShowUserSearch(true);
                }}
                onFocus={() => setShowUserSearch(true)}
                placeholder="Buscar usuário do sistema..."
                className="flex-1 bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowUserSearch(!showUserSearch)}
                className="bg-primary/10 border border-primary/20 rounded-xl px-3 hover:bg-primary/20 transition"
              >
                <Search className="w-4 h-4 text-primary" />
              </button>
            </div>

            {/* User search dropdown */}
            {showUserSearch && userSearchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-tactical-dark border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {userSearchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addUserToEnvolvidos(user)}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 transition border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <UserPlus className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-white font-mono text-sm">{user.icName || user.name}</div>
                        <div className="text-gray-500 font-mono text-xs">@{user.name}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected users */}
          {formData.envolvidos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.envolvidos.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5"
                >
                  <span className="text-white font-mono text-xs">{user.icName || user.name}</span>
                  <button
                    type="button"
                    onClick={() => removeUserFromEnvolvidos(user.id)}
                    className="text-gray-400 hover:text-white transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Procedimentos Adotados */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            Procedimentos Adotados
          </label>
          <textarea
            name="procedimentosAdotados"
            value={formData.procedimentosAdotados}
            onChange={handleInputChange}
            rows={3}
            placeholder="Descreva os procedimentos realizados..."
            className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none"
          />
        </div>

        {/* Upload de Imagem */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
            <Upload className="w-4 h-4" />
            Print do Armário (Opcional)
          </label>
          
          {!previewUrl ? (
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-primary/30 transition cursor-pointer bg-tactical-dark/50">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="imagem-upload"
              />
              <label
                htmlFor="imagem-upload"
                className="flex flex-col items-center justify-center gap-3 cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-500" />
                <span className="text-sm text-gray-400 font-mono">
                  Clique para fazer upload ou arraste a imagem
                </span>
                <span className="text-xs text-gray-600 font-mono">
                  Máximo: 5MB (JPG, PNG, WebP)
                </span>
              </label>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-2 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-white font-mono font-bold text-sm px-6 py-4 rounded-xl border border-primary/20 shadow-tactical-glow transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Siren className="w-4 h-4" />
              <span>Registrar Apreensão</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
