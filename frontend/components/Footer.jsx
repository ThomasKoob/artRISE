const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className=" bg-slate-900 w-full">
      <div className="flex justify-center">&copy; {currentYear} artRise</div>
    </div>
  );
};

export default Footer;
