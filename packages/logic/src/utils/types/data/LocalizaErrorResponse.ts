export default interface LocalizaErrorResponse extends Response {
  error:
    | "missing_parameters"
    | "no_available_categories_error"
    | "data_not_found"
    | "prices_not_found"
    | "out_of_schedule_pickup_date_error"
    | "out_of_schedule_pickup_hour_error"
    | "out_of_schedule_return_date_error"
    | "out_of_schedule_return_hour_error"
    | "inferior_pickup_date"
    | "inferior_return_date"
    | "unknown_error"
    | "connection_timeout"
    | "server_error";
  message: string;
}
