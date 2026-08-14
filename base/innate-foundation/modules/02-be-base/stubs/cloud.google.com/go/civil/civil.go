package civil

import (
	"fmt"
	"time"
)

type Date struct {
	Year  int
	Month time.Month
	Day   int
}

func (d Date) String() string {
	return fmt.Sprintf("%04d-%02d-%02d", d.Year, int(d.Month), d.Day)
}

func DateOf(t time.Time) Date {
	y, m, day := t.Date()
	return Date{Year: y, Month: m, Day: day}
}

func ParseDate(s string) (Date, error) {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return Date{}, err
	}
	return DateOf(t), nil
}

type Time struct {
	Hour       int
	Minute     int
	Second     int
	Nanosecond int
}

func (t Time) String() string {
	return fmt.Sprintf("%02d:%02d:%02d", t.Hour, t.Minute, t.Second)
}

func TimeOf(tm time.Time) Time {
	return Time{Hour: tm.Hour(), Minute: tm.Minute(), Second: tm.Second(), Nanosecond: tm.Nanosecond()}
}

func ParseTime(s string) (Time, error) {
	tm, err := time.Parse("15:04:05", s)
	if err != nil {
		tm, err = time.Parse("15:04:05.999999999", s)
		if err != nil {
			return Time{}, err
		}
	}
	return TimeOf(tm), nil
}

type DateTime struct {
	Date Date
	Time Time
}

func (dt DateTime) String() string { return dt.Date.String() + "T" + dt.Time.String() }

func DateTimeOf(t time.Time) DateTime {
	return DateTime{Date: DateOf(t), Time: TimeOf(t)}
}

func ParseDateTime(s string) (DateTime, error) {
	tm, err := time.Parse("2006-01-02T15:04:05", s)
	if err != nil {
		tm, err = time.Parse(time.RFC3339Nano, s)
		if err != nil {
			return DateTime{}, err
		}
	}
	return DateTimeOf(tm), nil
}
