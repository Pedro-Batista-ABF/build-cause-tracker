
import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function Settings() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleLogoUpload = () => {
    if (logoFile) {
      // This would typically upload to your backend or storage service
      // For now, we'll just simulate success with a toast
      localStorage.setItem('companyLogo', logoPreview || '');
      toast({
        title: "Logo atualizado",
        description: "O logo da empresa foi atualizado com sucesso.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">Configurações</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card-bg border-border-subtle">
          <CardHeader>
            <CardTitle className="text-text-primary">Logo da Empresa</CardTitle>
            <CardDescription className="text-text-secondary">
              Personalize o logo exibido no cabeçalho da aplicação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logoPreview && (
                <div className="mb-4 p-4 bg-dark-bg rounded-lg border border-border-subtle flex items-center justify-center">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="max-h-20 max-w-full" 
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="logo-upload" className="text-text-primary">Selecione uma imagem</Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="bg-dark-bg border-border-subtle text-text-primary"
                />
                <p className="text-xs text-text-secondary">
                  Formatos recomendados: SVG, PNG. Tamanho máximo: 1MB.
                </p>
              </div>
              
              <Button 
                onClick={handleLogoUpload} 
                disabled={!logoFile}
                className="w-full bg-accent-blue hover:bg-accent-dark-blue"
              >
                Salvar Logo
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional settings cards can be added here */}
      </div>
    </div>
  );
}
