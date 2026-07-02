export const getHeadingFromPath = (path: string): string => {
  // Remove leading and trailing slashes
  const cleanPath = path.replace(/^\/|\/$/g, '');

  // Split the path into segments
  const segments = cleanPath.split('/');

  // Capitalize each segment and join them with spaces
  const heading = segments
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1));

  // Return the heading or a default heading if empty
  return heading.findLast(segment => segment !== '')?.replaceAll('-', '') || '365 Together';
}; 