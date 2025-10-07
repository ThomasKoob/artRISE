const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className=" bg-violetHeader/70 backdrop-blur border-t-1 border-t-buttonPink/50 bottom-0 z-50">
      <div className="h-16 flex py-4 font-sans text-whiteLetter font-extralight text-xl justify-center">
        &copy; {currentYear} popAUC
      </div>
    </div>
  );
};

export default Footer;
