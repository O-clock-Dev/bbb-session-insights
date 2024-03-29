function convertUnixTimeStamp(timestamp) {
  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  };
  // let date = new Date(timestamp * 1000)
  const date = new Intl.DateTimeFormat("fr-FR", options).format(timestamp);
  return date;
}

export default convertUnixTimeStamp;
