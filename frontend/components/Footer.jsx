const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className=" bg-violetHeader/70">
      <div className="h-16 flex py-4 font-extralight text-xl justify-center">
        &copy; {currentYear} artRise
      </div>
    </div>
  );
};

export default Footer;
