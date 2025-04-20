
import React from 'react';
import { UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

interface PlanningAssistantMessageProps {
  content: string;
  timestamp: string;
  isLoading?: boolean;
}

export function PlanningAssistantMessage({ 
  content, 
  timestamp, 
  isLoading = false 
}: PlanningAssistantMessageProps) {
  // Process the message content to add formatting
  const formatMessageContent = (content: string) => {
    if (!content) return '';

    // Split content into paragraphs
    return content.split('\n').map((paragraph, idx) => {
      // Format headings (lines ending with :)
      if (paragraph.trim().endsWith(':') && paragraph.length < 50) {
        return (
          <h3 key={idx} className="text-lg font-semibold mt-3 mb-2 text-accent-blue">
            {paragraph}
          </h3>
        );
      }
      
      // Format lists (lines starting with - or •)
      if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
        return (
          <li key={idx} className="ml-4 mb-1">
            {paragraph.replace(/^[-•]\s*/, '')}
          </li>
        );
      }
      
      // Highlight activity names and high risk percentages
      const highlightedText = paragraph
        .replace(/(atividade\s+[\w\s]+)/gi, '<span class="font-medium">$1</span>')
        .replace(/(\d{2,3}%)/g, '<span class="text-accent-red font-medium">$1</span>');
      
      return (
        <p 
          key={idx} 
          className="mb-3" 
          dangerouslySetInnerHTML={{ __html: highlightedText }} 
        />
      );
    });
  };

  return (
    <div className="flex gap-4 py-4">
      <Avatar className="h-10 w-10 bg-accent-blue">
        <AvatarImage src="" />
        <AvatarFallback className="bg-accent-blue text-white">
          <UserRound className="h-6 w-6" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold">Assistente de Planejamento</h4>
          <span className="text-xs text-muted-foreground">
            {formatDate(timestamp)}
          </span>
        </div>
        
        <Card className="bg-card shadow-sm">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted/20 animate-pulse rounded w-3/4"></div>
                <div className="h-4 bg-muted/20 animate-pulse rounded w-5/6"></div>
                <div className="h-4 bg-muted/20 animate-pulse rounded w-2/3"></div>
                <div className="h-4 bg-muted/20 animate-pulse rounded w-4/5"></div>
                <div className="h-4 bg-muted/20 animate-pulse rounded w-3/4"></div>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                {formatMessageContent(content)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
