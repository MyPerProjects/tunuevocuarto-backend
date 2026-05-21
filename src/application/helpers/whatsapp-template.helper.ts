export class WhatsappTemplatesHelper {
  /**
   * Genera el mensaje de cobro o recordatorio de mensualidad pendiente
   */
  static getPendingPaymentMessage(data: {
    tenantName: string;
    unitNumber: string;
    monthlyRent: number;
    yapeNumber: string;
    bcpAccount: string;
    isAutomaticCron?: boolean;
  }): string {
    const saludo = `Hola ${data.tenantName}, te saludamos de CuarTech. 🏠`;
    const recordatorio = data.isAutomaticCron
      ? `Te recordamos que hoy vence la mensualidad de tu cuarto (${data.unitNumber}) por el monto de S/ ${Number(data.monthlyRent).toFixed(2)}.`
      : `Te recordamos que tienes un pago pendiente de tu mensualidad (${data.unitNumber}) por S/ ${Number(data.monthlyRent).toFixed(2)}.`;

    return `${saludo} ${recordatorio}\n\n📲 Puedes realizar tu pago vía Yape al: ${data.yapeNumber}\n💳 O vía BCP: ${data.bcpAccount}\n\nPor favor, envía la captura del comprobante una vez realizado. ¡Muchas gracias!`;
  }

  /**
   * Genera el mensaje de agradecimiento tras registrar un pago exitoso
   */
  static getPaymentSuccessMessage(data: {
    tenantName: string;
    unitNumber: string;
    nextPaymentDate: string;
  }): string {
    return `✅ ¡Gracias por tu pago, ${data.tenantName}! Hemos registrado tu mensualidad del cuarto ${data.unitNumber}. Tu próxima fecha de pago será el ${data.nextPaymentDate}. ¡Que tengas un gran día!`;
  }
}
