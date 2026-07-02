export function getUserStatus(status: number) {
  let statusText = "";
  switch (status) {
    case 1:
      statusText = "Active";
      break;
    case -10:
      statusText = "Deleted";
      break;
    case -1:
      statusText = "Locked";
      break;
    case -5:
      statusText = "Expired";
      break;
    default:
      statusText = "Unknown";
      break;
  } ;
  return statusText;
}


export function getUserDisplayClass(status: number) {
  let statusClass = "text-muted-foreground";
  switch (status) {
    case 1:
      statusClass = "text-success";
      break;
    case -10:
      statusClass = "text-destructive";
      break;
    case -1:
      statusClass = "text-warning";
      break;
    case -5:
      statusClass = "text-warning";
      break;
    default:
      statusClass = "text-muted-foreground";
      break;
  }
  return statusClass;
}
