import bwipjs from "bwip-js/node";
import { z } from "zod";
export function barcodeSvg(code: string) {
  z.string().regex(/^[A-Z0-9-]{3,32}$/).parse(code);
  return bwipjs.toSVG({ bcid: "code128", text: code, height: 8, scale: 1, paddingwidth: 6, paddingheight: 1, backgroundcolor: "FFFFFF" });
}
