import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PropertyService } from '../../application/services/property.service';
import { CreatePropertyDto } from '../dtos/create-property.dto';
import { UpdatePropertyDto } from '../dtos/update-property.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('properties')
@UseGuards(AuthGuard('jwt')) // Protegemos todas las rutas con JWT
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  async create(@Body() createPropertyDto: CreatePropertyDto, @Req() req: any) {
    return await this.propertyService.createProperty(
      createPropertyDto,
      req.user.userId,
    );
  }

  @Get()
  async findAll(@Req() req: any) {
    // Inyectamos obligatoriamente el id del usuario logueado
    return await this.propertyService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    // Validamos que la propiedad le pertenezca a quien la solicita
    return await this.propertyService.findOne(+id, req.user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Req() req: any,
  ) {
    return await this.propertyService.updateProperty(
      +id,
      updatePropertyDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return await this.propertyService.removeProperty(+id, req.user.userId);
  }
}
