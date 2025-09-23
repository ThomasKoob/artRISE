import { useState } from "react";
import { useEffect } from "react";
import { useParams } from "react-router";
import ArtworkCard from "../components/ArtworkCard";
 
const Auction = () => { 
  const [artworks, setArtworks] = useState([]);
  const { auctionId } = useParams();

  useEffect(() => {
    fetch(`http://localhost:3001/auctions/${auctionId}/artworks`)
      .then((res) => res.json())
      .then((data) => {
        setArtworks(data);
      });
  }, [auctionId]);

  return (
  <div className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {artworks.length > 0 ? (
        artworks.map((art) => <ArtworkCard key={art._id} artwork={art} />)
      ) : (
        <p className="col-span-full text-center text-gray-500">
          No artworks found for this auction.
        </p>
      )}
 
      {/* Add a test 
      artwork card here */}

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
  );
};

export default Auction;


