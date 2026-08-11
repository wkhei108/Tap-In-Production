import { redirect } from 'next/navigation';

/**
 * The library moved to /admin/media/[slug]. Anyone with the old URL
 * bookmarked lands on the campaigns overview instead of a dead end.
 */
export default function AdminMediaIndexPage() {
  redirect('/admin');
}
