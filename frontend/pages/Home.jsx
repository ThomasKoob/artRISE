import ArtworkCard from "../components/ArtworkCard";

const Home = () => {
  return (
    <>
      <div className="flex flex-col max-w-[1400px] mx-auto">
        <div className="text-2xl mx-auto m-4">
          HOME CONTENT HEADLINE
        </div>

        <p>HOME CONTENT ARTICLE</p>

       
        <div className="flex justify-center mt-6">
          <ArtworkCard
            artwork={{
              title: "Test Artwork",
              description: "This is just a test card",
              images: ["https://picsum.photos/400/300"],
              price: 200,
              currency: "EUR",
              status: "available",
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Home;

