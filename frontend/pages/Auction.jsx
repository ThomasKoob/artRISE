import { useState } from "react";
import { useEffect } from "react";
import { useParams } from "react-router";
import ArtworkCard from "../components/ArtworkCard";
 
const Auction = () => { 
  const [artworks, setArtworks] = useState([]);
  const { auctionId } = useParams();

  useEffect(() => {
    fetch(`http://localhost:3000/auctions/${auctionId}/artworks`)
      .then((res) => res.json())
      .then((data) => {
        setArtworks(data);
      });
  }, [auctionId]);

  return (
    <>
 <div className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {artworks.map((art) => (
        <ArtworkCard key={art._id} artwork={art} />
      ))}
    </div>
    </>
  );
};

export default Auction;


