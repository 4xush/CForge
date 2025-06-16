import { Linkedin, Twitter } from "lucide-react";

const SocialLinks = ({ socialNetworks }) => {
  const { linkedin, twitter } = socialNetworks || {};

  if (!linkedin && !twitter) return null;

  return (
    <div className="flex space-x-4">
      {linkedin && (
        <a
          href={`https://www.linkedin.com/in/${linkedin}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-blue-100 text-blue-600 hover:text-blue-800 rounded-md p-2 transition-colors duration-200"
          aria-label="LinkedIn Profile"
        >
          <Linkedin className="h-5 w-5" />
        </a>
      )}
      {twitter && (
        <a
          href={`https://twitter.com/${twitter}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-blue-100 text-blue-500 hover:text-blue-700 rounded-md p-2 transition-colors duration-200"
          aria-label="Twitter Profile"
        >
          <Twitter className="h-5 w-5" />
        </a>
      )}
    </div>
  );
};

export default SocialLinks;
