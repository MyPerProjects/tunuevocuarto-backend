import { Module, Global } from '@nestjs/common';
import { WhatsappService } from '../../application/services/whatsapp.service';
import { WhatsappGateway } from '../gateways/whatsapp.gateway';
import { WhatsappController } from '../controllers/whatsapp.controller';

@Global()
@Module({
  controllers: [WhatsappController], // REGISTRADO AQUÍ
  providers: [WhatsappService, WhatsappGateway],
  exports: [WhatsappService, WhatsappGateway],
})
export class WhatsappModule {}
