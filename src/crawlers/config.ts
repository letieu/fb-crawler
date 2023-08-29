export default {
  response_timeout: 10000,
  base_url: "https://mbasic.facebook.com/",
  username_field: 'input[name="email"]',
  password_field: 'input[name="pass"]',
  login_button: 'input[type="submit"]',

  code_field: 'input[name="approvals_code"]',
  confirm_code_button: 'input[type="submit"]',

  username_invalid_msg:
    "The email address or mobile number you entered isn't connected to an account.",
  password_invalid_msg: "The password that you've entered is incorrect",
  credentials_invalid_msg_01: "Wrong Credentials",
  credentials_invalid_msg_02: "Invalid username or password",
  regex_remove_non_numeric: /[^0-9]/g,
  page_end_msg: "search results only include things visible to you.",
  page_not_available_msg: "this page isn't available",
  content_not_available_msg: "this content isn't available right now",
  content_not_available_msg_02: "this content isn't available at the moment",
  content_not_available_msg_03: "we didn't find anything",
  user_profile_check_msg: "add friend",
  no_results_msg: "we didn't find any results",
  end_of_results: "end of results",
  date_time_format: "DD/MM/YYYY HH:mm:ss",
  close_button_selector: "div[aria-label='Close']",
  seven_days_timestamp: 7 * 24 * 60 * 60 * 1000,
  login_button_name: "log in",
  public_post_exclude_keyword: "see all public posts for",

  create_post_button: 'input[type="submit"][name="view_post"]',
};
