import { QueryBuilder } from "../helpers/db-helper";

export default async function sendSms(phone: any, content: any, sms_from = '') {
  try {
    const response = await fetch(`https://2factor.in/API/V1/${process.env.SMS_KEY}/SMS/+91${phone}/${content}/OTPTemplate`, {
      method: 'GET',
    });
    const logId = await new QueryBuilder('sms_log')
      .insert({
        phone,
        content,
        sms_from,
        is_sent: response.ok ? 1 : 0
      });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }


    const data = await response.json();
    const rawData = JSON.stringify(data)
    await new QueryBuilder('sms_log')
      .where('id = ?', logId)
      .update({
        raw_response: rawData
      })

    return data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
} 