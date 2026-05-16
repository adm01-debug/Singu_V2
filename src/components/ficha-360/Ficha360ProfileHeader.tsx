import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Ficha360ProfileHeaderProps {
  fullName: string;
  initials: string;
  profile: any;
  sentimentClass: (s?: string | null) => string;
}

export function Ficha360ProfileHeader({
  fullName,
  initials,
  profile,
  sentimentClass
}: Ficha360ProfileHeaderProps) {
  return (
    <Card className="sticky top-0 z-10">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar className="h-16 w-16">
            <AvatarImage src={undefined} alt={fullName} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {initials || <User className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
              {fullName}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {profile?.cargo ? `${profile.cargo}` : 'Cargo não informado'}
              {profile?.company_name ? ` · ${profile.company_name}` : ''}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="default" className="text-xs">
                Score: {profile?.relationship_score ?? '—'}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                Estágio: {profile?.relationship_stage ?? '—'}
              </Badge>
              <Badge
                variant="outline"
                className={cn('text-xs capitalize', sentimentClass(profile?.sentiment))}
              >
                {profile?.sentiment ?? 'Sentimento —'}
              </Badge>
              {profile?.company_id && (
                <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <Link to={`/empresas/${profile.company_id}`}>Ver empresa</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}