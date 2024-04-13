function convertUnixTimeStamp(timestamp: number) {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  };
  // let date = new Date(timestamp * 1000)
  return new Intl.DateTimeFormat("fr-FR", options).format(timestamp);
}

export default convertUnixTimeStamp;
