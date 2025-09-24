import { useState } from "react";

export default function ArtworkCard({ artwork }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Card */}
      <div className="card bg-base-100 w-80 shadow-md">
        <figure>
          <img
            src={artwork.images || "https://via.placeholder.com/400x300"}
            alt={artwork.title}
            className="h-60 w-full object-cover rounded-t-lg"
          />
        </figure>
        <div className="card-body">
          <h2 className="card-title text-lg font-bold">
            {artwork.title}
            {artwork.status === "live" && (
              <span className="badge badge-success">Live</span>
            )}
            {artwork.status === "draft" && (
              <span className="badge badge-warning">Draft</span>
            )}
            {artwork.status === "ended" && (
              <span className="badge badge-error">Ended</span>
            )}
            {artwork.status === "canceled" && (
              <span className="badge badge-neutral">Canceled</span>
            )}
          </h2>

          <p className="text-sm text-gray-600 line-clamp-2">
            {artwork.description}
          </p>

          <div className="mt-2 flex justify-between items-center">
            <span className="badge badge-outline font-semibold text-base">
              {artwork.price} {artwork.currency}
            </span>

            
            <button
              onClick={() => setOpen(true)}
              className="btn   bg-orange-300"
            >
              Open
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setOpen(false)}
        >
          <div className="max-w-3xl max-h-[90vh] p-4">
            <img
              src={artwork.images}
              alt={artwork.title}
              className="rounded-lg shadow-lg max-h-[80vh] object-contain"
            />
            <p className="mt-4 text-center text-white font-semibold text-lg">
              {artwork.title}
            </p>
          </div>
        </div>
      )}
    </>
  );
}





