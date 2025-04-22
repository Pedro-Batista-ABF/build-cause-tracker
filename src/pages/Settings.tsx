
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsibleContactForm } from "@/components/contacts/ResponsibleContactForm";
import { ResponsibleList } from "@/components/contacts/ResponsibleList";

export default function Settings() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Responsáveis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsibleContactForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Responsáveis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsibleList />
        </CardContent>
      </Card>
    </div>
  );
}
