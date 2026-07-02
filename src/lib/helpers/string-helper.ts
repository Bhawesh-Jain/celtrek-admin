export default function capitalizeWord(s: string) : string {
  if (!s || s.length == 0) {
    return '';
  }

  var word = s.charAt(0).toUpperCase();
  word += s.substring(1, s.length)
  return word
}

export function getProcessName(process: string)  {
  if (!process || process.length == 0) {
    return '';
  }

  var processName = process.charAt(0).toUpperCase();
  processName += process.substring(1, process.length)

  let processNameArr = processName.split('_');
  processNameArr.pop();  
  
  return processNameArr.join(' ')
}