const Logo = () => {
  return (
    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #E879F9 0%, #FB923C 50%, #A855F7 100%)',
        }}
      />
    </div>
  );
};

export default Logo;
