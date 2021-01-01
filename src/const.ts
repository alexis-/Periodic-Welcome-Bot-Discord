import { DateTime } from 'luxon';

export default {
  initialMoment: DateTime.fromISO('2020-12-31'),
  sqlPageSize: 500,
  maxDelay: 24 * 7, // theoretical max: 255 (TINY INT)
  msgMinLength: 2,
  msgUserPlaceholder: '{{users}}'
}
