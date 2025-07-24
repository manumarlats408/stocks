"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Bell,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Edit,
  LogOut,
  Activity,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SymbolSearch } from "@/components/symbol-search"
import { useStockData } from "@/hooks/useStockData"
import { useSupabaseData } from "@/hooks/useSupabaseData"
import { AuthWrapper } from "@/components/auth-wrapper"
import { formatCurrency, formatNumber, formatPercentage, formatInteger } from "@/lib/number-format"

export default function StockPortfolio() {
  const {
    portfolio: dbPortfolio,
    alerts: dbAlerts,
    loading: dbLoading,
    error: dbError,
    user,
    addStock: addStockToDB,
    updateStock: updateStockInDB,
    deleteStock: deleteStockFromDB,
    addAlert: addAlertToDB,
    updateAlert: updateAlertInDB,
    signOut,
  } = useSupabaseData()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
  const [newStock, setNewStock] = useState({
    symbol: "",
    name: "",
    shares: "",
    purchasePrice: "",
  })
  const [newAlert, setNewAlert] = useState({
    symbol: "",
    type: "above" as "above" | "below",
    price: "",
  })

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<any>(null)
  const [editStock, setEditStock] = useState({
    symbol: "",
    name: "",
    shares: "",
    purchasePrice: "",
  })

  // Hook para obtener datos de las acciones
  const {
    quotes,
    loading: quotesLoading,
    error: quotesError,
    refreshQuotes,
    isApiConfigured,
    lastUpdateTime,
    apiCallsUsed,
  } = useStockData(dbPortfolio.map((stock) => stock.symbol))

  // Verificar alertas cuando cambien las cotizaciones
  useEffect(() => {
    Object.values(quotes).forEach((quote) => {
      dbAlerts.forEach((alert) => {
        if (alert.symbol === quote.symbol && !alert.triggered) {
          const shouldTrigger =
            (alert.alert_type === "above" && quote.price >= alert.target_price) ||
            (alert.alert_type === "below" && quote.price <= alert.target_price)

          if (shouldTrigger) {
            updateAlertInDB(alert.id, { triggered: true })
          }
        }
      })
    })
  }, [quotes, dbAlerts, updateAlertInDB])

  const addStock = async () => {
    if (!newStock.symbol || !newStock.shares || !newStock.purchasePrice) {
      alert("Por favor completa todos los campos")
      return
    }

    try {
      await addStockToDB({
        symbol: newStock.symbol.toUpperCase(),
        name: newStock.name || newStock.symbol,
        shares: Number.parseFloat(newStock.shares.replace(",", ".")),
        purchase_price: Number.parseFloat(newStock.purchasePrice.replace(",", ".")),
      })
      setNewStock({ symbol: "", name: "", shares: "", purchasePrice: "" })
      setIsAddDialogOpen(false)
    } catch (error) {
      alert("Error al agregar la acción: " + (error as Error).message)
    }
  }

  const removeStock = async (id: string) => {
    try {
      await deleteStockFromDB(id)
    } catch (error) {
      alert("Error al eliminar la acción: " + (error as Error).message)
    }
  }

  const openEditDialog = (stock: any) => {
    setEditingStock(stock)
    setEditStock({
      symbol: stock.symbol,
      name: stock.name,
      shares: formatNumber(stock.shares, 0),
      purchasePrice: formatNumber(stock.purchase_price, 2),
    })
    setIsEditDialogOpen(true)
  }

  const updateStock = async () => {
    if (!editStock.shares || !editStock.purchasePrice || !editingStock) {
      alert("Por favor completa todos los campos")
      return
    }

    try {
      await updateStockInDB(editingStock.id, {
        shares: Number.parseFloat(editStock.shares.replace(/\./g, "").replace(",", ".")),
        purchase_price: Number.parseFloat(editStock.purchasePrice.replace(/\./g, "").replace(",", ".")),
      })
      setEditStock({ symbol: "", name: "", shares: "", purchasePrice: "" })
      setEditingStock(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      alert("Error al actualizar la acción: " + (error as Error).message)
    }
  }

  const addAlert = async () => {
    if (!newAlert.symbol || !newAlert.price) {
      alert("Por favor completa todos los campos")
      return
    }

    try {
      await addAlertToDB({
        symbol: newAlert.symbol.toUpperCase(),
        alert_type: newAlert.type,
        target_price: Number.parseFloat(newAlert.price.replace(",", ".")),
        triggered: false,
      })
      setNewAlert({ symbol: "", type: "above", price: "" })
      setIsAlertDialogOpen(false)
    } catch (error) {
      alert("Error al crear la alerta: " + (error as Error).message)
    }
  }

  const handleSymbolSelect = (symbol: string, name: string) => {
    setNewStock((prev) => ({ ...prev, symbol, name }))
  }

  // Calcular métricas del portafolio
  const totalValue = dbPortfolio.reduce((sum, stock) => {
    const quote = quotes[stock.symbol]
    return sum + (quote ? quote.price * stock.shares : 0)
  }, 0)

  const totalInvested = dbPortfolio.reduce((sum, stock) => sum + stock.purchase_price * stock.shares, 0)
  const totalGainLoss = totalValue - totalInvested
  const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0

  const triggeredAlerts = dbAlerts.filter((alert) => alert.triggered)

  // Show loading while checking configuration
  if (dbLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-sm text-gray-600">Cargando configuración...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If there's a configuration error, let AuthWrapper handle it
  if (dbError && dbError.includes("configurado")) {
    return (
      <AuthWrapper>
        <div />
      </AuthWrapper>
    )
  }

  // Si no está configurada la API, mostrar mensaje de configuración
  if (!isApiConfigured) {
    return (
      <AuthWrapper>
        <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Configuración Requerida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">Para usar esta aplicación necesitas configurar tu API key de Twelve Data.</p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Pasos:</p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>
                    Ve a{" "}
                    <a
                      href="https://twelvedata.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      twelvedata.com
                    </a>
                  </li>
                  <li>Regístrate para una cuenta gratuita</li>
                  <li>Obtén tu API key</li>
                  <li>
                    Configura la variable de entorno{" "}
                    <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_TWELVE_DATA_API_KEY</code>
                  </li>
                </ol>
              </div>
              <Alert>
                <AlertDescription>
                  <strong>Plan gratuito:</strong> 800 requests por día, datos con delay de 15 minutos
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </AuthWrapper>
    )
  }

  // Exportar a Excel (CSV)
  const downloadExcel = () => {
    if (!dbPortfolio || Object.keys(quotes).length === 0) {
      alert("No hay datos suficientes para exportar");
      return;
    }

    const headers = ["Símbolo", "Cantidad de Acciones", "Precio Actual (USD)"];
    const rows = dbPortfolio.map((stock) => {
      const quote = quotes[stock.symbol];
      return [
        stock.symbol,
        stock.shares,
        quote ? quote.price.toFixed(2).replace(".", ",") : "Sin datos",
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "portafolio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Portafolio de Acciones</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span>✅ Datos reales de Twelve Data API • 💾 Guardado en Supabase</span>
                {quotesLoading && <span className="text-blue-600">• Actualizando...</span>}
                {lastUpdateTime && <span className="text-sm">• Última actualización: {lastUpdateTime}</span>}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {user && <span>Conectado como: {user.email}</span>}
                <span className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  API calls usadas: {apiCallsUsed}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-end">
              <Button variant="outline" onClick={refreshQuotes} disabled={quotesLoading} className="w-full sm:w-auto">
                <RefreshCw className={`w-4 h-4 mr-2 ${quotesLoading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>

              <Button variant="outline" onClick={downloadExcel} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>

              <Button variant="outline" onClick={signOut} className="w-full sm:w-auto">
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>

              <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Bell className="w-4 h-4 mr-2" />
                    Alertas
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Alerta de Precio</DialogTitle>
                    <DialogDescription>Recibe notificaciones cuando una acción alcance cierto precio</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="alert-symbol">Símbolo</Label>
                      <Input
                        id="alert-symbol"
                        value={newAlert.symbol}
                        onChange={(e) => setNewAlert((prev) => ({ ...prev, symbol: e.target.value }))}
                        placeholder="AAPL"
                      />
                    </div>
                    <div>
                      <Label htmlFor="alert-type">Tipo</Label>
                      <select
                        id="alert-type"
                        className="w-full p-2 border rounded-md"
                        value={newAlert.type}
                        onChange={(e) =>
                          setNewAlert((prev) => ({ ...prev, type: e.target.value as "above" | "below" }))
                        }
                      >
                        <option value="above">Por encima de</option>
                        <option value="below">Por debajo de</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="alert-price">Precio (usar coma para decimales: 150,50)</Label>
                      <Input
                        id="alert-price"
                        type="text"
                        value={newAlert.price}
                        onChange={(e) => setNewAlert((prev) => ({ ...prev, price: e.target.value }))}
                        placeholder="150,50"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={addAlert}>Crear Alerta</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog> 

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Acción
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Nueva Acción</DialogTitle>
                    <DialogDescription>Busca y agrega acciones a tu portafolio</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Buscar Símbolo</Label>
                      <SymbolSearch onSymbolSelect={handleSymbolSelect} />
                    </div>

                    {newStock.symbol && (
                      <>
                        <div>
                          <Label htmlFor="selected-symbol">Símbolo Seleccionado</Label>
                          <Input
                            id="selected-symbol"
                            value={`${newStock.symbol} - ${newStock.name}`}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shares">Cantidad de Acciones</Label>
                          <Input
                            id="shares"
                            type="text"
                            value={newStock.shares}
                            onChange={(e) => setNewStock((prev) => ({ ...prev, shares: e.target.value }))}
                            placeholder="10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="purchase-price">
                            Precio de Compra USD (usar coma para decimales: 150,50)
                          </Label>
                          <Input
                            id="purchase-price"
                            type="text"
                            value={newStock.purchasePrice}
                            onChange={(e) => setNewStock((prev) => ({ ...prev, purchasePrice: e.target.value }))}
                            placeholder="150,50"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={addStock}
                      disabled={!newStock.symbol || !newStock.shares || !newStock.purchasePrice}
                    >
                      Agregar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Editar Acción</DialogTitle>
                    <DialogDescription>Modifica los datos de tu inversión</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-symbol">Símbolo</Label>
                      <Input
                        id="edit-symbol"
                        value={`${editStock.symbol} - ${editStock.name}`}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-shares">Cantidad de Acciones</Label>
                      <Input
                        id="edit-shares"
                        type="text"
                        value={editStock.shares}
                        onChange={(e) => setEditStock((prev) => ({ ...prev, shares: e.target.value }))}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-purchase-price">Precio de Compra USD (usar coma para decimales)</Label>
                      <Input
                        id="edit-purchase-price"
                        type="text"
                        value={editStock.purchasePrice}
                        onChange={(e) => setEditStock((prev) => ({ ...prev, purchasePrice: e.target.value }))}
                        placeholder="150,50"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={updateStock} disabled={!editStock.shares || !editStock.purchasePrice}>
                      Actualizar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {(quotesError || dbError) && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error:</strong> {quotesError || dbError}
              </AlertDescription>
            </Alert>
          )}

          {triggeredAlerts.length > 0 && (
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                <strong>Alertas activadas:</strong>{" "}
                {triggeredAlerts
                  .map(
                    (alert) =>
                      `${alert.symbol} ${alert.alert_type === "above" ? "superó" : "cayó por debajo de"} ${formatCurrency(alert.target_price)}`,
                  )
                  .join(", ")}
              </AlertDescription>
            </Alert>
          )}

          {/* Información de uso de API */}
          {dbPortfolio.length > 0 && (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                <strong>Optimización de API:</strong> Usando {Math.ceil(dbPortfolio.length / 8)} llamada(s) para{" "}
                {dbPortfolio.length} acción(es) • Total usado en esta sesión: {apiCallsUsed} llamadas
              </AlertDescription>
            </Alert>
          )}

          {/* Resumen del Portafolio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invertido</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ganancia/Pérdida</CardTitle>
                {totalGainLoss >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(Math.abs(totalGainLoss))}
                </div>
                <p className={`text-xs ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {totalGainLoss >= 0 ? "+" : "-"}
                  {formatPercentage(Math.abs(totalGainLossPercent))}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acciones</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dbPortfolio.length}</div>
                <p className="text-xs text-muted-foreground">
                  {formatInteger(dbPortfolio.reduce((sum, stock) => sum + stock.shares, 0))} acciones totales
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabla del Portafolio */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Inversiones</CardTitle>
              <CardDescription>
                Cotizaciones reales de Twelve Data • Optimizado para usar mínimos créditos API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dbPortfolio.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tienes acciones en tu portafolio</p>
                  <p className="text-sm text-gray-400 mt-2">Haz clic en "Agregar Acción" para comenzar</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Símbolo</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Acciones</TableHead>
                        <TableHead>Precio Compra</TableHead>
                        <TableHead>Precio Actual</TableHead>
                        <TableHead>Cambio</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Ganancia/Pérdida</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dbPortfolio.map((stock) => {
                        const quote = quotes[stock.symbol]
                        const currentPrice = quote?.price || 0
                        const totalValue = currentPrice * stock.shares
                        const totalInvested = stock.purchase_price * stock.shares
                        const gainLoss = totalValue - totalInvested
                        const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0

                        return (
                          <TableRow key={stock.id}>
                            <TableCell className="font-medium">{stock.symbol}</TableCell>
                            <TableCell className="text-sm text-gray-600">{quote?.name || stock.name}</TableCell>
                            <TableCell>{formatInteger(stock.shares)}</TableCell>
                            <TableCell>{formatCurrency(stock.purchase_price)}</TableCell>
                            <TableCell>
                              {quote ? (
                                formatCurrency(quote.price)
                              ) : (
                                <span className="text-gray-400">Sin datos</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {quote && (
                                <Badge variant={quote.changePercent >= 0 ? "default" : "destructive"}>
                                  {quote.changePercent >= 0 ? "+" : ""}
                                  {formatPercentage(quote.changePercent)}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{formatCurrency(totalValue)}</TableCell>
                            <TableCell>
                              <div className={gainLoss >= 0 ? "text-green-600" : "text-red-600"}>
                                {formatCurrency(Math.abs(gainLoss))}
                                <div className="text-xs">
                                  ({gainLoss >= 0 ? "+" : "-"}
                                  {formatPercentage(Math.abs(gainLossPercent))})
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {quote && (
                                <Badge variant={quote.isMarketOpen ? "default" : "secondary"}>
                                  {quote.isMarketOpen ? "Abierto" : "Cerrado"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(stock)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => removeStock(stock.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diversificación del Portafolio */}
          {dbPortfolio.length > 0 && totalValue > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Diversificación del Portafolio</CardTitle>
                <CardDescription>Distribución de tu inversión por acción</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dbPortfolio.map((stock) => {
                    const quote = quotes[stock.symbol]
                    const stockValue = quote ? quote.price * stock.shares : 0
                    const percentage = totalValue > 0 ? (stockValue / totalValue) * 100 : 0

                    return (
                      <div key={stock.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            {stock.symbol} - {quote?.name || stock.name}
                          </span>
                          <span>{formatNumber(percentage, 1)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthWrapper>
  )
}
