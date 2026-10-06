/** Marca do app (pilhas de moedas + seta de tendência). O arquivo vive em /public/favicon.svg. */
export function Logo({ size = 32 }: { size?: number }) {
  return <img className="brand-logo" src={`${import.meta.env.BASE_URL}favicon.svg`} width={size} height={size} alt="" aria-hidden />;
}
