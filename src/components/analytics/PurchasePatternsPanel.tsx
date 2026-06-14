import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Calendar,
  Package,
  RefreshCw,
  BarChart3,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { usePurchasePatterns } from '@/hooks/usePurchasePatterns';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PurchasePatternsPanelProps {
  compact?: boolean;
}

export function PurchasePatternsPanel({ compact = false }: PurchasePatternsPanelProps) {
  const { patterns, categoryPatterns, predictions, stats, loading, refresh } = usePurchasePatterns();
  const [activeTab, setActiveTab] = useState('predictions');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, compact ? 3 : 4].map(i => (
            <Skeleton key={`skeleton-${i}`} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const getFrequencyColor = (frequency: 'high' | 'medium' | 'low') => {
    switch (frequency) {
      case 'high': return 'bg-success/10 text-success';
      case 'medium': return 'bg-warning/10 text-warning';
      case 'low': return 'bg-muted text-muted-foreground';
    }
  };

  const getFrequencyLabel = (frequency: 'high' | 'medium' | 'low') => {
    switch (frequency) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Padrões de Compra</CardTitle>
              <p className="text-sm text-muted-foreground">
                Detecção automática de ciclos e oportunidades
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-destructive/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
              <div className="text-xs text-muted-foreground">Atrasados</div>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-warning">{stats.upcomingWeek}</div>
              <div className="text-xs text-muted-foreground">Próx. 7 dias</div>
            </div>
            <div className="p-3 bg-success/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-success">{stats.highFrequency}</div>
              <div className="text-xs text-muted-foreground">Alta Freq.</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL',
                  notation: 'compact'
                }).format(stats.totalRevenue)}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="predictions" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Previsões
              </TabsTrigger>
              <TabsTrigger value="patterns" className="text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                Padrões
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs">
                <Package className="w-3 h-3 mr-1" />
                Categorias
              </TabsTrigger>
            </TabsList>

            <TabsContent value="predictions" className="mt-4 space-y-3">
              {predictions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma previsão para os próximos dias</p>
                </div>
              ) : (
                predictions.slice(0, compact ? 3 : 5).map((prediction) => (
                  <Link 
                    key={`prediction-${prediction.contactId}-${prediction.predictedDate}`} 
                    to={`/contatos/${prediction.contactId}`}
                    className="block"
                  >
                    <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{prediction.contactName}</div>
                          <div className="text-sm text-muted-foreground">
                            {prediction.reason}
                          </div>
                        </div>
                        <Badge 
                          variant={prediction.confidence >= 80 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {prediction.confidence}% conf.
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(prediction.predictedDate), "d 'de' MMM", { locale: ptBR })}
                        </div>
                        <div className="flex gap-1">
                          {prediction.suggestedProducts.slice(0, 2).map((product) => (
                            <Badge key={`product-${product}`} variant="outline" className="text-xs">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </TabsContent>

            <TabsContent value="patterns" className="mt-4 space-y-3">
              {patterns.slice(0, compact ? 3 : 5).map((pattern) => (
                <Link 
                  key={`pattern-${pattern.contactId}`} 
                  to={`/contatos/${pattern.contactId}`}
                  className="block"
                >
                  <div className={`p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                    pattern.isOverdue ? 'border-destructive/50 bg-destructive/5' : ''
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {pattern.isOverdue && (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                        <div>
                          <div className="font-medium">{pattern.contactName}</div>
                          <div className="text-xs text-muted-foreground">
                            Ciclo médio: {pattern.averageCycleDays} dias
                          </div>
                        </div>
                      </div>
                      <Badge className={getFrequencyColor(pattern.purchaseFrequency)}>
                        {getFrequencyLabel(pattern.purchaseFrequency)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Última compra</div>
                        <div className="font-medium">
                          {formatDistanceToNow(new Date(pattern.lastPurchaseDate), { 
                            locale: ptBR, 
                            addSuffix: true 
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total</div>
                        <div className="font-medium">{pattern.totalPurchases} compras</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Valor</div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          }).format(pattern.totalAmount)}
                        </div>
                      </div>
                    </div>

                    {pattern.seasonalPattern && (
                      <div className="mt-2 text-xs text-info">
                        📅 {pattern.seasonalPattern}
                      </div>
                    )}

                    <div className="mt-2 flex gap-1">
                      {pattern.preferredProducts.slice(0, 3).map((product) => (
                        <Badge key={`pref-${product}`} variant="outline" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </TabsContent>

            <TabsContent value="categories" className="mt-4 space-y-3">
              {categoryPatterns.slice(0, compact ? 3 : 5).map((category) => (
                <div key={`category-${category.category}`} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="font-medium">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }).format(category.totalAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.totalPurchases} compras
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    Ticket médio: {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(category.averageAmount)}
                  </div>

                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Top:</span>
                    {category.topContacts.slice(0, 3).map((contact) => (
                      <Link 
                        key={`top-${contact.contactId}`} 
                        to={`/contatos/${contact.contactId}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {contact.contactName.split(' ')[0]}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
