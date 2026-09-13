import { prisma } from '../../config/prisma';
import { CreateInstrumentInput } from './instruments.schema';

export function listInstruments() {
  return prisma.instrument.findMany({ orderBy: { name: 'asc' } });
}

export function createInstrument(input: CreateInstrumentInput) {
  return prisma.instrument.upsert({
    where: { name: input.name },
    update: {},
    create: { name: input.name },
  });
}
