'use server'

import { MiscRepository } from "../repositories/miscRepository";
import { getSession } from "../session";

export async function emptyFunc() {
  const session = await getSession();

  const miscRepository = new MiscRepository();
  return await miscRepository.emptyFunc();
}
