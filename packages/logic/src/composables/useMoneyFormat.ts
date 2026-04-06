export default function useMoneyFormat() {
  const format = Intl.NumberFormat("es-CO", {
    style: "decimal",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });

  const moneyFormat = (number_input: number): string =>
    format.format(number_input);

  return { moneyFormat };
}
