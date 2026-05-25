/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { ContentController } from './content.controller';

describe('ContentController', () => {
  // @ts-ignore
  let controller: ContentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentController],
    }).compile();

    controller = module.get<ContentController>(ContentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
