// Utilidades para formatear números en formato europeo/latinoamericano
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace("US$", "$")
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercentage(value: number, decimals = 2): string {
  return new Intl.NumberFormat("es-ES", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

// Para números grandes sin decimales (como cantidad de acciones)
export function formatInteger(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0,
  }).format(value)
}
