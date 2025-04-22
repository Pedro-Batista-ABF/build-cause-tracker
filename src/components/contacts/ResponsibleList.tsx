
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResponsibleContact {
  id: string;
  name: string;
  email: string;
  discipline: string | null;
}

interface Activity {
  id: string;
  name: string;
  discipline: string | null;
  responsible: string | null;
  unit: string | null;
  total_qty: number | null;
  progress: number;
}

export function ResponsibleList() {
  const [contacts, setContacts] = useState<ResponsibleContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    try {
      const { data, error } = await supabase
        .from("responsible_contacts")
        .select("*")
        .order("name");

      if (error) throw error;
      setContacts(data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Erro ao carregar contatos");
    } finally {
      setLoading(false);
    }
  }

  async function sendActivityReport(contact: ResponsibleContact) {
    setSendingEmail(contact.id);
    try {
      // Fetch activities for this responsible
      const { data: activities, error: activitiesError } = await supabase
        .from("activities")
        .select("*")
        .eq("responsible", contact.name);

      if (activitiesError) throw activitiesError;

      // Send email through edge function
      const { error } = await supabase.functions.invoke("send-activity-report", {
        body: {
          recipientName: contact.name,
          recipientEmail: contact.email,
          activities: activities,
        },
      });

      if (error) throw error;

      toast.success(`Relatório enviado para ${contact.name}`);
    } catch (error) {
      console.error("Error sending report:", error);
      toast.error(`Erro ao enviar relatório para ${contact.name}`);
    } finally {
      setSendingEmail(null);
    }
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Disciplina</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell>{contact.name}</TableCell>
            <TableCell>{contact.email}</TableCell>
            <TableCell>{contact.discipline || "-"}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sendActivityReport(contact)}
                disabled={sendingEmail === contact.id}
              >
                <Mail className="h-4 w-4 mr-2" />
                {sendingEmail === contact.id ? "Enviando..." : "Enviar Relatório"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
