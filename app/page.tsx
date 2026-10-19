import HomePage from '@/components/home/HomePage';
import { getHomeImages } from '@/lib/homeImages';

export default function LandingPage() {
  return <HomePage images={getHomeImages()} />;
}
