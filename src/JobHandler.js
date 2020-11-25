const {CoreFlashArbRelayerJob} = require("./jobs/relayer/CoreFlashArbRelayerJob");
const {JobExecutor} = require("./jobs/JobExecutor");
const {UnitradeRelayerJob} = require("./jobs/relayer/UnitradeRelayerJob");
const {UniswapV2SlidingOracleJob} = require("./jobs/relayer/UniswapV2SlidingOracleJob");

const { Logger } = require("./helper/logger");

class JobHandler {

    constructor(wallet, provider) {
        this.provider = provider;
        this.account = wallet.connect(provider);
        this.availableJobs = [];
        this.registerAvailableJobs();
        this.runningJobs = [];
        this.log = Logger("JobHandler");
    }

    registerAvailableJobs(){
        this.availableJobs.push(
            this.createJob(UniswapV2SlidingOracleJob),
            this.createJob(UnitradeRelayerJob),
            this.createJob(CoreFlashArbRelayerJob)
        );

    }

    createJob(jobClass){
        return new jobClass(this.account, this.provider);
    }

    start(jobName) {
        const job = this.availableJobs
            .find(job => job.name.toLowerCase() === jobName.toLowerCase());
        if (job){
            if (!this.isStarted(jobName)){
                try {
                    const jobExecutor = new JobExecutor(job, this.provider);
                    jobExecutor.start();
                    this.runningJobs.push(jobExecutor);
                    this.log.info(`${job.name} is started`);
                } catch (error){
                    this.log.error(`Couldn't start ${job.name}: ${error}`);
                }
            } else {
                this.log.info(`${job.name} is already started`);
            }
        } else {
            this.log.warning(`${jobName} was not found`);
        }
    }

    isStarted(jobName){
        return !!this.getExecutor(jobName);
    }

    getExecutor(jobName){
        return this.runningJobs
            .find(executor => executor.job.name.toLowerCase() === jobName.toLowerCase());
    }

    stop(jobName){
        const executor = this.getExecutor(jobName);
        if (executor) {
            executor.stop();
            this.runningJobs = this.runningJobs.filter(jobExec => jobExec !== executor);
            this.log.info(`${executor.job.name} is stopped`);
        } else {
            this.log.info(`${jobName} is not started`);
        }
    }

}

exports.JobHandler = JobHandler;
