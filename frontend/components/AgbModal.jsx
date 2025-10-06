// frontend/components/AgbModal.jsx
import React from "react";

export const AgbModal = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-darkBackground border border-coldYellow/40 rounded-2xl p-6 md:p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-whiteLetter/60 hover:text-whiteLetter text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-2xl font-light font-sans text-whiteLetter mb-6">
          Terms & Conditions
        </h2>

        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none text-whiteLetter/90 space-y-4">
          <p className="text-sm">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <h3 className="text-lg font-medium mt-6 mb-3">
            1. Acceptance of Terms
          </h3>
          <p>
            By accessing and using popAUC (&quot;the Platform&quot;), you accept
            and agree to be bound by these Terms & Conditions. If you do not
            agree, please do not use our services.
          </p>

          <h3 className="text-lg font-medium mt-6 mb-3">2. User Accounts</h3>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials. You agree to provide accurate, current, and
            complete information during registration.
          </p>

          <h3 className="text-lg font-medium mt-6 mb-3">
            3. Auctions & Bidding
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>All bids placed are binding and cannot be retracted.</li>
            <li>
              The highest bidder at the end of an auction is obligated to
              purchase the artwork.
            </li>
            <li>
              Payment must be completed within 7 days of auction end unless
              otherwise specified.
            </li>
          </ul>

          <h3 className="text-lg font-medium mt-6 mb-3">
            4. Artist Responsibilities
          </h3>
          <p>
            Artists must ensure that all uploaded content is original, properly
            licensed, and does not infringe on third-party rights. Artists are
            responsible for accurate descriptions and images.
          </p>

          <h3 className="text-lg font-medium mt-6 mb-3">
            5. Fees & Commissions
          </h3>
          <p>
            popAUC charges at the moment no commission on successful sales.
            Details of fees are available in your account settings and are
            subject to change with notice.
          </p>

          <h3 className="text-lg font-medium mt-6 mb-3">
            6. Prohibited Conduct
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Fraudulent bidding or manipulation of auctions</li>
            <li>Uploading illegal, offensive, or inappropriate content</li>
            <li>Harassment of other users</li>
            <li>Unauthorized use of the Platform</li>
          </ul>

          <h3 className="text-lg font-medium mt-6 mb-3">
            7. Intellectual Property
          </h3>
          <p>
            All content on popAUC, including logos, designs, and software, is
            owned by popAUC or its licensors. Artists retain ownership of their
            artwork but grant popAUC a license to display and promote it on the
            Platform.
          </p>

          <h3 className="text-lg font-medium mt-6 mb-3">
            8. Limitation of Liability
          </h3>
          <p>
            popAUC is not liable for disputes between buyers and sellers,
            artwork authenticity, or payment issues beyond our control. Use the
            Platform at your own risk.
          </p>

          <h3 className="text-lg font-medium mt-6 mb-3">9. Privacy</h3>
          <p>
            Your use of the Platform is also governed by our Privacy Policy,
            which explains how we collect, use, and protect your data.
          </p>

          <h3 className="text-lg font-medium mt-6 mb-3">10. Termination</h3>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these Terms or engage in prohibited conduct.
          </p>

          <h3 className="text-lg font-medium mt-6 mb-3">
            11. Changes to Terms
          </h3>
          <p>
            popAUC may update these Terms at any time. Continued use of the
            Platform after changes constitutes acceptance of the new Terms.
          </p>

          <h3 className="text-lg font-medium mt-6 mb-3">12. Contact</h3>
          <p>
            For questions or concerns about these Terms, please contact us under
            support.
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm rounded-xl text-whiteLetter/80 hover:text-whiteLetter"
          >
            Close
          </button>
          {onAccept && (
            <button
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="btn btn-sm rounded-xl bg-greenButton text-darkBackground hover:bg-greenButton/80"
            >
              Accept Terms
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
