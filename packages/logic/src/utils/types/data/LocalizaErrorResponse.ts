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
    | "holiday_pickup_date_error"
    | "holiday_return_date_error"
    | "holiday_out_of_schedule_pickup_date_error"
    | "holiday_out_of_schedule_return_date_error"
    | "same_hour_error"
    | "reservation_cancelled_error"
    | "unknown_error"
    | "connection_timeout"
    | "server_error"
    // Web-synthesized (not emitted by Localiza): set by classifyOneWayDistanceError
    // when Localiza can't price a one-way because the inter-city distance isn't
    // registered (unknown_error + shortText LLNRRE003). See rentacar-dashboard#205.
    | "one_way_not_available";
  message: string;
  shortText?: string;
}
