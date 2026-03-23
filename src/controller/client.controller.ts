import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { SaveClientDTO } from '../dto/save-client.dto';
import { ClientService } from '../service/client.service';

export interface IClientController {
  create(client: SaveClientDTO): Promise<any>;
}
@Controller('client')
export class ClientController implements IClientController {
  constructor(private readonly clientService: ClientService) {}
  @Post()
  @ApiBody({ type: SaveClientDTO })
  @ApiResponse({ status: 201, description: 'Client created' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() client: SaveClientDTO) {
    return await this.clientService.create(client);
  }
}
