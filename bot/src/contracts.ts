import { Contract } from "ethers";
import { wallet } from "./provider";
import { RSCEngineAbi, RSCEngineAddress } from "../abi/RSCEngine-abi";
import { DemoOracleAbi, DemoOracleAddress } from "../abi/DemoOracle-abi";
import { RSCAbi, RSCAddress } from "../abi/ReactiveSomniaCoin-abi";

const engineAddress = process.env.RSC_ENGINE_ADDRESS ?? RSCEngineAddress;
const oracleAddress = process.env.DEMO_ORACLE_ADDRESS ?? DemoOracleAddress;
const rscAddress = process.env.RSC_ADDRESS ?? RSCAddress;

export const engine = new Contract(engineAddress, RSCEngineAbi, wallet);
export const oracle = new Contract(oracleAddress, DemoOracleAbi, wallet);
export const rsc = new Contract(rscAddress, RSCAbi, wallet);

export { engineAddress, oracleAddress, rscAddress };
