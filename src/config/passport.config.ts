import passport, { Profile } from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import db from '@/config/database'
import { User } from '@/models/user.model'

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			callbackURL: process.env.GOOGLE_CALLBACK_URL!,
		},
		(_accessToken: string, _refreshToken: string, profile: Profile, done) => {
			;(async () => {
				let user = await db.User.findOne({ where: { googleId: profile.id } })
				console.log(profile)
				if (!user) {
					user = await db.User.create({
						googleId: profile.id,
						name: profile.displayName,
						email: profile.emails?.[0]?.value || '',
						provider: ['google'],
						avatar: profile.photos?.[0]?.value,
						emailVerified: false,
						otp_status: false,
						phone_number: '',
					})
				} else {
					user.update({
						googleId: profile.id,
						avatar: profile.photos?.[0]?.value,
						emailVerified: false,
						provider: ['google'],
						phone_number: '',
					})
				}
				return done(null, user)
			})().catch((err) => done(err, false))
		},
	),
)

passport.use(
	new FacebookStrategy(
		{
			clientID: process.env.FACEBOOK_APP_ID!,
			clientSecret: process.env.FACEBOOK_APP_SECRET!,
			callbackURL: process.env.FACEBOOK_CALLBACK_URL!,
			profileFields: ['id', 'displayName', 'emails', 'photos'],
		},
		(_accessToken: string, _refreshToken: string, profile: Profile, done) => {
			;(async () => {
				let user = await db.User.findOne({ where: { facebookId: profile.id } })
				const email = profile.emails?.[0]?.value || ''
				if (!user) {
					user = await db.User.create({
						facebookId: profile.id,
						name: profile.displayName || '',
						email,
						provider: ['facebook'],
						avatar: profile.photos?.[0]?.value,
						emailVerified: true,
						otp_status: false,
						phone_number: email,
					})
				}
				return done(null, user)
			})().catch((err) => done(err, false))
		},
	),
)

passport.serializeUser((user, done) => {
	try {
		const userId = (user as User).id
		done(null, userId)
	} catch (err) {
		done(err as Error, null)
	}
})

passport.deserializeUser((id: number, done) => {
	db.User.findByPk(id)
		.then((user: User | null) => done(null, user))
		.catch((err: unknown) => done(err as Error, null))
})

export default passport
