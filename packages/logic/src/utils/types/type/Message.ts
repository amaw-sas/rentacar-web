export default interface Message {
  type: "error" | "info";
  title?: string;
  message: string;
}
