// ==============================================
// DISC Template Library - Ready-to-Use Phrases
// Enterprise Level Component
// ==============================================

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFavoriteTemplates } from '@/hooks/useFavoriteTemplates';
import {
  Book, Copy, Star, Search, MessageSquare,
  PhoneCall, Mail, Video, Send, CheckCircle,
  Zap, Target, Heart, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DISCProfile } from '@/types';
import { DISC_PROFILES } from '@/data/discAdvancedData';

import { DISC_TEMPLATES, DISCTemplate as Template } from '@/data/discTemplatesData';


const CHANNEL_ICONS = {
  call: <PhoneCall className="w-3 h-3" />,
  email: <Mail className="w-3 h-3" />,
  whatsapp: <Send className="w-3 h-3" />,
  meeting: <Video className="w-3 h-3" />,
  all: <MessageSquare className="w-3 h-3" />
};

const PROFILE_ICONS = {
  D: <Zap className="w-3 h-3" />,
  I: <Star className="w-3 h-3" />,
  S: <Heart className="w-3 h-3" />,
  C: <Shield className="w-3 h-3" />
};

interface DISCTemplateLibraryProps {
  filterProfile?: Exclude<DISCProfile, null>;
}

const DISCTemplateLibrary: React.FC<DISCTemplateLibraryProps> = ({ filterProfile }) => {
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavoriteTemplates();
  const [activeProfile, setActiveProfile] = useState<string>(filterProfile || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredTemplates = useMemo(() => {
    return DISC_TEMPLATES.filter(template => {
      const matchesProfile = activeProfile === 'all' || template.discProfiles.includes(activeProfile as Exclude<DISCProfile, null>);
      const matchesSearch = searchQuery === '' || 
        template.template.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.context.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFav = !showFavoritesOnly || isFavorite(template.id);
      return matchesProfile && matchesSearch && matchesFav;
    });
  }, [activeProfile, searchQuery, showFavoritesOnly, isFavorite]);

  const categories = useMemo(() => {
    const cats = [...new Set(filteredTemplates.map(t => t.category))];
    return cats;
  }, [filteredTemplates]);

  const copyToClipboard = async (template: Template) => {
    await navigator.clipboard.writeText(template.template);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: '📋 Template Copiado!',
      description: `${template.category} - ${template.context}`
    });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Biblioteca de Templates DISC</CardTitle>
          </div>
          <Badge variant="outline">{filteredTemplates.length} templates</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="gap-1.5 shrink-0"
          >
            <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Favoritos
          </Button>
        </div>

        {/* Profile Tabs */}
        <Tabs value={activeProfile} onValueChange={setActiveProfile}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
            {(['D', 'I', 'S', 'C'] as const).map(profile => (
              <TabsTrigger key={profile} value={profile} className="flex-1 gap-1">
                {PROFILE_ICONS[profile]}
                {profile}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Templates by Category */}
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {categories.map(category => {
              const categoryTemplates = filteredTemplates.filter(t => t.category === category);
              if (categoryTemplates.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryTemplates.map(template => {
                      const isCopied = copiedId === template.id;

                      return (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="gap-1">
                                {CHANNEL_ICONS[template.channel]}
                                {template.channel === 'all' ? 'Todos' : template.channel}
                              </Badge>
                              {template.discProfiles.map(p => (
                                <Badge 
                                  key={p}
                                  style={{ 
                                    backgroundColor: DISC_PROFILES[p]?.color?.bg,
                                    color: DISC_PROFILES[p]?.color?.text
                                  }}
                                  className="gap-1"
                                >
                                  {PROFILE_ICONS[p]}
                                  {p}
                                </Badge>
                              ))}
                              <span className="text-xs text-muted-foreground">
                                {template.context}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => toggleFavorite(template.id)}
                              >
                                <Star className={`w-3.5 h-3.5 ${isFavorite(template.id) ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
                              </Button>
                              <Badge variant="secondary" className="text-xs">
                                {template.effectiveness}% eficaz
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-line leading-relaxed">
                                {template.template}
                              </p>
                            </div>
                            <Button
                              variant={isCopied ? "default" : "outline"}
                              size="sm"
                              onClick={() => copyToClipboard(template)}
                              className="gap-1 shrink-0"
                            >
                              {isCopied ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copiar
                                </>
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DISCTemplateLibrary;
