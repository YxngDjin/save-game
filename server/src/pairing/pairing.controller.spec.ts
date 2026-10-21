import { Test, TestingModule } from '@nestjs/testing';
import { PairingController } from './pairing.controller.js';
import { PairingService } from './pairing.service.js';

describe('PairingController', () => {
  let controller: PairingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PairingController],
      providers: [PairingService],
    }).compile();

    controller = module.get<PairingController>(PairingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
