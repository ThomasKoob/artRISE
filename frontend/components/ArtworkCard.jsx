// src/components/ArtworkCard.jsx
import { Link } from "react-router";

export default function ArtworkCard({ artwork }) {
  return (
    <div className="card bg-base-100 w-96 shadow-sm">
      <figure>
        <img
          src={artwork.images?.[0] || "https://via.placeholder.com/400x300"}
          alt={artwork.title}
          className="h-60 w-full object-cover"
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title">
          {artwork.title}
          {artwork.status === "available" && (
            <span className="badge badge-success">Available</span>
          )}
        </h2>
        <p>{artwork.description}</p>
        <div className="card-actions justify-between items-center">
          <span className="badge badge-outline">
            {artwork.price} {artwork.currency}
          </span>
          
          <Link
            to={`/artworks/${artwork._id}`}
            className="btn btn-sm btn-primary"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}


