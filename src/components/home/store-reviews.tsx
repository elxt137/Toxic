import { Star } from "lucide-react";

import type { StoreReview } from "@/lib/home-content";

import styles from "./home.module.css";

const formatDate = (value: string) => new Intl.DateTimeFormat("es-AR", { timeZone: "UTC" }).format(new Date(value));

export function StoreReviews({ reviews }: { reviews: StoreReview[] }) {
  if (!reviews.length) return null;
  return (
    <section className={`${styles.reviews} shell`}>
      <h2 className={styles.sectionTitle}>Opiniones de clientes</h2>
      <div className={styles.reviewsTrack}>
        {reviews.map((review) => (
          <article key={review.id} className={styles.reviewCard}>
            <div><span className={styles.stars} aria-label={`${review.rating} de 5 estrellas`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} aria-hidden="true" fill={n <= review.rating ? "currentColor" : "none"} />)}</span><time dateTime={review.date}>{formatDate(review.date)}</time></div>
            <p>{review.text}</p>
            <footer><b>{review.author}</b><span>{review.city}</span></footer>
          </article>
        ))}
      </div>
    </section>
  );
}
